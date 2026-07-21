package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func ConnectRedis() error {
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisPass := os.Getenv("REDIS_PASSWORD")

	if redisHost == "" || redisPort == "" {
		return fmt.Errorf("FATAL ERROR: Redis environment variables (REDIS_HOST, REDIS_PORT) are not properly set in .env file")
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password:     redisPass,
		DB:           0,
		PoolSize:     20,
		MinIdleConns: 5,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Println("Warning: Redis is not running. Caching will fail if not started.", err)
		return err
	}
	
	return nil
}
