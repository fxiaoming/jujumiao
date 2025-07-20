package data

import (
	"backend/internal/conf"
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ProviderSet is data providers.
var ProviderSet = wire.NewSet(NewData, NewConversationRepo, NewUserRepo)

// Data .
type Data struct {
	// TODO wrapped database client
	Mongo *mongo.Client
	Redis *redis.Client
}

// NewData .
func NewData(c *conf.Data, logger log.Logger, mongo *mongo.Client, redis *redis.Client) (*Data, func(), error) {
	cleanup := func() {
		log.NewHelper(logger).Info("closing the data resources")
	}
	return &Data{Mongo: mongo, Redis: redis}, cleanup, nil
}

// buildMongoURI 构建 MongoDB 连接字符串，支持环境变量替换
func buildMongoURI(source string) string {
	// 如果设置了完整的 MONGO_URI 环境变量，直接使用
	if mongoURI := os.Getenv("MONGO_URI"); mongoURI != "" {
		return mongoURI
	}

	// 替换环境变量
	uri := source
	uri = strings.ReplaceAll(uri, "${MONGO_USER}", os.Getenv("MONGO_USER"))
	uri = strings.ReplaceAll(uri, "${MONGO_PASS}", os.Getenv("MONGO_PASS"))
	uri = strings.ReplaceAll(uri, "${MONGO_HOST}", os.Getenv("MONGO_HOST"))
	uri = strings.ReplaceAll(uri, "${MONGO_PORT}", os.Getenv("MONGO_PORT"))
	uri = strings.ReplaceAll(uri, "${MONGO_DB}", os.Getenv("MONGO_DB"))

	return uri
}

func NewMongoClient(conf *conf.Data) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建连接字符串
	uri := buildMongoURI(conf.Database.Source)

	// 打印连接信息（不包含密码）
	logURI := uri
	if strings.Contains(logURI, "@") {
		// 隐藏密码信息
		parts := strings.Split(logURI, "@")
		if len(parts) == 2 {
			authPart := parts[0]
			if strings.Contains(authPart, ":") {
				authParts := strings.Split(authPart, ":")
				if len(authParts) >= 3 {
					// mongodb://username:password@host
					logURI = fmt.Sprintf("mongodb://%s:***@%s", authParts[1], parts[1])
				}
			}
		}
	}
	fmt.Printf("Connecting to MongoDB: %s\n", logURI)

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// 测试连接
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	fmt.Println("Successfully connected to MongoDB")
	return client, nil
}

func NewRedisClient(c *conf.Data) (*redis.Client, error) {
	return redis.NewClient(&redis.Options{
		Addr:     c.Redis.Addr,
		Password: c.Redis.Password,
		DB:       int(c.Redis.Db),
	}), nil
}
