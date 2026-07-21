package models

import (
	"time"

	"gorm.io/plugin/soft_delete"
)

type Task struct {
	ID          uint                  `json:"id" gorm:"primaryKey"`
	Title       string                `json:"title" gorm:"type:varchar(255);uniqueIndex:idx_title_deleted;not null"`
	Description string                `json:"description"`
	Status      string                `json:"status" gorm:"default:'pending'"`
	AssigneeID  *uint                 `json:"assignee_id"`
	DueDate     *time.Time            `json:"due_date"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
	DeletedAt   soft_delete.DeletedAt `json:"deleted_at" gorm:"uniqueIndex:idx_title_deleted"`
}
