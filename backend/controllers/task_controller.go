package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"gin-quickstart/dto"
	"gin-quickstart/helpers"
	"gin-quickstart/repositories"
	"gin-quickstart/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TaskController struct {
	service services.TaskService
}

func NewTaskController(service services.TaskService) *TaskController {
	return &TaskController{service: service}
}

func (ctrl *TaskController) CreateTask(c *gin.Context) {
	var req dto.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	task, err := ctrl.service.CreateTask(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, repositories.ErrDuplicateTitle) {
			helpers.RespondError(c, http.StatusConflict, "Task title already exists")
			return
		}
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create task")
		return
	}

	helpers.RespondJSON(c, http.StatusCreated, task)
}

func (ctrl *TaskController) GetTasks(c *gin.Context) {
	status := c.Query("status")
	keyword := c.Query("keyword")
	assignee := c.Query("assignee")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	isOverdue := c.Query("is_overdue")
	sort := c.DefaultQuery("sort", "created_at desc")
	page, errPage := strconv.Atoi(c.DefaultQuery("page", "1"))
	if errPage != nil || page < 1 {
		page = 1
	}
	limit, errLimit := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if errLimit != nil || limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	cacheKey := fmt.Sprintf("tasks:query:p=%d_l=%d_st=%s_kw=%s_asg=%s_sd=%s_ed=%s_srt=%s_ovd=%s", page, limit, status, keyword, assignee, startDate, endDate, sort, isOverdue)

	res, err := ctrl.service.GetTasks(c.Request.Context(), status, keyword, assignee, startDate, endDate, sort, isOverdue, cacheKey, page, limit)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch tasks")
		return
	}

	helpers.RespondJSON(c, http.StatusOK, res)
}

func (ctrl *TaskController) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid input data: "+err.Error())
		return
	}

	task, err := ctrl.service.UpdateTask(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			helpers.RespondError(c, http.StatusNotFound, "Task not found")
			return
		}
		if errors.Is(err, repositories.ErrDuplicateTitle) {
			helpers.RespondError(c, http.StatusConflict, "Task title already exists")
			return
		}
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update task")
		return
	}

	helpers.RespondJSON(c, http.StatusOK, task)
}

func (ctrl *TaskController) DeleteTask(c *gin.Context) {
	id := c.Param("id")

	if err := ctrl.service.DeleteTask(c.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			helpers.RespondError(c, http.StatusNotFound, "Task not found")
			return
		}
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete task")
		return
	}

	helpers.RespondJSON(c, http.StatusOK, gin.H{"message": "Task soft-deleted successfully"})
}
