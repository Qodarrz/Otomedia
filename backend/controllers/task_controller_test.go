package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"gin-quickstart/config"
	"gin-quickstart/models"
	"gin-quickstart/repositories"
	"gin-quickstart/services"

	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func SetupTestEnvironment(t *testing.T) (*gin.Engine, *gorm.DB, *redis.Client) {
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	db.AutoMigrate(&models.Task{})

	mr, err := miniredis.Run()
	assert.NoError(t, err)
	t.Cleanup(func() { mr.Close() })

	redisClient := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})
	config.RedisClient = redisClient

	taskRepo := repositories.NewTaskRepository(db)
	taskService := services.NewTaskService(taskRepo, redisClient)
	taskController := NewTaskController(taskService)

	r := gin.Default()
	api := r.Group("/api")
	{
		api.GET("/tasks", taskController.GetTasks)
		api.POST("/tasks", taskController.CreateTask)
		api.PUT("/tasks/:id", taskController.UpdateTask)
		api.DELETE("/tasks/:id", taskController.DeleteTask)
	}

	return r, db, redisClient
}

func TestSearchTask(t *testing.T) {
	r, db, _ := SetupTestEnvironment(t)

	db.Create(&models.Task{Title: "Belajar Golang", Description: "Test 123", Status: "pending"})
	db.Create(&models.Task{Title: "Belajar React", Description: "Test 456", Status: "completed"})

	req, _ := http.NewRequest("GET", "/api/tasks?keyword=Golang", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.Task `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.Len(t, response.Data, 1)
	assert.Equal(t, "Belajar Golang", response.Data[0].Title)
}

func TestUpdateTaskAndCacheInvalidation(t *testing.T) {
	r, db, redisClient := SetupTestEnvironment(t)

	task := models.Task{Title: "Tugas Lama", Description: "Desc", Status: "pending"}
	db.Create(&task)

	cacheKey := "tasks:page=1"
	redisClient.Set(config.Ctx, cacheKey, "dummy_data", 60*time.Second)

	updatePayload := map[string]string{
		"title":  "Tugas Baru Diperbarui",
		"status": "completed",
	}
	jsonValue, _ := json.Marshal(updatePayload)
	req, _ := http.NewRequest("PUT", "/api/tasks/1", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updatedTask models.Task
	db.First(&updatedTask, 1)
	assert.Equal(t, "Tugas Baru Diperbarui", updatedTask.Title)
	assert.Equal(t, "completed", updatedTask.Status)

	_, err := redisClient.Get(config.Ctx, cacheKey).Result()
	assert.Error(t, err, "Cache should be invalidated after update")
}

func TestUnassignTask(t *testing.T) {
	r, db, _ := SetupTestEnvironment(t)

	assigneeID := uint(42)
	task := models.Task{Title: "Task Assigned", Description: "Desc", Status: "pending", AssigneeID: &assigneeID}
	db.Create(&task)

	jsonValue := []byte(`{"assignee_id": null}`)
	req, _ := http.NewRequest("PUT", "/api/tasks/1", bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var updatedTask models.Task
	db.First(&updatedTask, 1)
	assert.Nil(t, updatedTask.AssigneeID, "AssigneeID should be set to nil")
}

func TestSoftDeleteTask(t *testing.T) {
	r, db, _ := SetupTestEnvironment(t)

	task := models.Task{Title: "Task To Be Soft Deleted Unique", Description: "Desc", Status: "pending"}
	db.Create(&task)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/tasks/%d", task.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var foundTask models.Task
	err := db.First(&foundTask, task.ID).Error
	assert.ErrorIs(t, err, gorm.ErrRecordNotFound, "Soft deleted task should not be returned by standard query")

	reqGet, _ := http.NewRequest("GET", "/api/tasks?keyword=Unique", nil)
	wGet := httptest.NewRecorder()
	r.ServeHTTP(wGet, reqGet)

	var response struct {
		Data []models.Task `json:"data"`
	}
	json.Unmarshal(wGet.Body.Bytes(), &response)
	assert.Len(t, response.Data, 0, "Task list should not include soft deleted task")
}
