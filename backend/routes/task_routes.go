package routes

import (
	"gin-quickstart/controllers"

	"github.com/gin-gonic/gin"
)

func SetupTaskRoutes(api *gin.RouterGroup, taskController *controllers.TaskController) {
	tasks := api.Group("/tasks")
	{
		tasks.GET("", taskController.GetTasks)
		tasks.POST("", taskController.CreateTask)
		tasks.PUT("/:id", taskController.UpdateTask)
		tasks.DELETE("/:id", taskController.DeleteTask)
	}
}
