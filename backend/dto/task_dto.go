package dto

import (
	"encoding/json"
	"time"
)

type NullableUint struct {
	Value *uint
	Valid bool
}

func (n *NullableUint) UnmarshalJSON(data []byte) error {
	n.Valid = true
	if string(data) == "null" {
		n.Value = nil
		return nil
	}
	var v uint
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	n.Value = &v
	return nil
}

type CreateTaskRequest struct {
	Title       string `json:"title" binding:"required,min=3,max=255"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=pending in_progress completed"`
	AssigneeID  *uint      `json:"assignee_id"`
	DueDate     *time.Time `json:"due_date" binding:"omitempty"`
}

type UpdateTaskRequest struct {
	Title       *string      `json:"title" binding:"omitempty,min=3,max=255"`
	Description *string      `json:"description"`
	Status      *string      `json:"status" binding:"omitempty,oneof=pending in_progress completed"`
	AssigneeID  NullableUint `json:"assignee_id"`
	DueDate     *time.Time   `json:"due_date" binding:"omitempty"`
}
