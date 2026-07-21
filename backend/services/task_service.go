package services

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"gin-quickstart/dto"
	"gin-quickstart/models"
	"gin-quickstart/repositories"

	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/singleflight"
)

type TaskService interface {
	CreateTask(ctx context.Context, req dto.CreateTaskRequest) (*models.Task, error)
	GetTasks(ctx context.Context, status, keyword, assignee, startDate, endDate, sort, isOverdue, cacheKey string, page, limit int) (dto.PaginatedResponse, error)
	UpdateTask(ctx context.Context, id string, req dto.UpdateTaskRequest) (*models.Task, error)
	DeleteTask(ctx context.Context, id string) error
}

type taskService struct {
	repo        repositories.TaskRepository
	redisClient *redis.Client
	sg          singleflight.Group
}

func NewTaskService(repo repositories.TaskRepository, redisClient *redis.Client) TaskService {
	return &taskService{repo: repo, redisClient: redisClient}
}

func (s *taskService) InvalidateCache(ctx context.Context) {
	if s.redisClient == nil {
		return
	}
	// Use SCAN to safely find and unlink keys matching 'tasks:*' without memory leaks or Lua stack limits
	var cursor uint64
	for {
		keys, nextCursor, err := s.redisClient.Scan(ctx, cursor, "tasks:*", 100).Result()
		if err != nil {
			log.Printf("Failed to scan cache keys: %v", err)
			break
		}
		if len(keys) > 0 {
			if err := s.redisClient.Unlink(ctx, keys...).Err(); err != nil {
				log.Printf("Failed to unlink cache keys: %v", err)
			}
		}
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
}

func (s *taskService) CreateTask(ctx context.Context, req dto.CreateTaskRequest) (*models.Task, error) {
	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		AssigneeID:  req.AssigneeID,
		DueDate:     req.DueDate,
	}
	if task.Status == "" {
		task.Status = "pending"
	}
	if err := s.repo.Create(task); err != nil {
		return nil, err
	}
	s.InvalidateCache(ctx)
	return task, nil
}

func (s *taskService) GetTasks(ctx context.Context, status, keyword, assignee, startDate, endDate, sort, isOverdue, cacheKey string, page, limit int) (dto.PaginatedResponse, error) {
	if s.redisClient != nil {
		cachedData, err := s.redisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var res dto.PaginatedResponse
			if json.Unmarshal([]byte(cachedData), &res) == nil {
				return res, nil
			}
		}
	}

	result, err, _ := s.sg.Do(cacheKey, func() (interface{}, error) {
		offset := (page - 1) * limit
		tasks, total, err := s.repo.FindAll(status, keyword, assignee, startDate, endDate, sort, isOverdue, limit, offset)
		if err != nil {
			return nil, err
		}

		totalPages := int(total) / limit
		if int(total)%limit != 0 {
			totalPages++
		}

		res := dto.PaginatedResponse{
			Data: tasks,
			Meta: dto.Meta{
				CurrentPage: page,
				Limit:       limit,
				TotalData:   int(total),
				TotalPages:  totalPages,
			},
		}

		if s.redisClient != nil {
			jsonData, _ := json.Marshal(res)
			if err := s.redisClient.Set(ctx, cacheKey, jsonData, 60*time.Second).Err(); err != nil {
				log.Printf("Failed to cache tasks: %v", err)
			}
		}

		return res, nil
	})

	if err != nil {
		return dto.PaginatedResponse{}, err
	}

	return result.(dto.PaginatedResponse), nil
}

func (s *taskService) UpdateTask(ctx context.Context, id string, req dto.UpdateTaskRequest) (*models.Task, error) {
	_, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.AssigneeID.Valid {
		if req.AssigneeID.Value != nil {
			updates["assignee_id"] = *req.AssigneeID.Value
		} else {
			updates["assignee_id"] = nil
		}
	}
	if req.DueDate != nil {
		updates["due_date"] = req.DueDate
	}

	updatedTask, err := s.repo.Update(id, updates)
	if err != nil {
		return nil, err
	}
	s.InvalidateCache(ctx)

	return updatedTask, nil
}

func (s *taskService) DeleteTask(ctx context.Context, id string) error {
	err := s.repo.Delete(id)
	if err == nil {
		s.InvalidateCache(ctx)
	}
	return err
}
