package repositories

import (
	"errors"
	"strings"

	"gin-quickstart/models"

	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"
)

var ErrDuplicateTitle = errors.New("duplicate title")

func isDuplicateError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
		return true
	}
	if strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "Duplicate entry") {
		return true
	}
	return false
}

type TaskRepository interface {
	Create(task *models.Task) error
	FindAll(status, keyword, assignee, startDate, endDate, sort, isOverdue string, limit, offset int) ([]models.Task, int64, error)
	FindByID(id string) (*models.Task, error)
	Update(id string, updates map[string]interface{}) (*models.Task, error)
	Delete(id string) error
}

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{db}
}

func (r *taskRepository) Create(task *models.Task) error {
	err := r.db.Create(task).Error
	if isDuplicateError(err) {
		return ErrDuplicateTitle
	}
	return err
}

func (r *taskRepository) FindAll(status, keyword, assignee, startDate, endDate, sort, isOverdue string, limit, offset int) ([]models.Task, int64, error) {
	var tasks []models.Task
	var total int64

	baseQuery := r.db.Model(&models.Task{})

	if status != "" {
		baseQuery = baseQuery.Where("status = ?", status)
	}
	if keyword != "" {
		baseQuery = baseQuery.Where(r.db.Where("title LIKE ?", "%"+keyword+"%").Or("description LIKE ?", "%"+keyword+"%"))
	}
	if assignee != "" {
		baseQuery = baseQuery.Where("assignee_id = ?", assignee)
	}
	if startDate != "" {
		baseQuery = baseQuery.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		if !strings.Contains(endDate, " ") && !strings.Contains(endDate, "T") {
			endDate = endDate + " 23:59:59"
		}
		baseQuery = baseQuery.Where("created_at <= ?", endDate)
	}
	if isOverdue == "true" {
		baseQuery = baseQuery.Where("due_date < NOW() AND status != 'completed'")
	}

	if err := baseQuery.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	allowedSorts := map[string]bool{
		"created_at asc":  true,
		"created_at desc": true,
		"updated_at asc":  true,
		"updated_at desc": true,
		"due_date asc":    true,
		"due_date desc":   true,
		"title asc":       true,
		"title desc":      true,
		"status asc":      true,
		"status desc":     true,
	}
	if !allowedSorts[strings.ToLower(sort)] {
		sort = "created_at desc"
	}

	err := baseQuery.Order(sort).Limit(limit).Offset(offset).Find(&tasks).Error
	return tasks, total, err
}

func (r *taskRepository) FindByID(id string) (*models.Task, error) {
	var task models.Task
	if err := r.db.First(&task, id).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) Update(id string, updates map[string]interface{}) (*models.Task, error) {
	err := r.db.Model(&models.Task{}).Where("id = ?", id).Updates(updates).Error
	if isDuplicateError(err) {
		return nil, ErrDuplicateTitle
	}
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *taskRepository) Delete(id string) error {
	res := r.db.Delete(&models.Task{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
