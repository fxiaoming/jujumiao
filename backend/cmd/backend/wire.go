//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"backend/internal/biz"
	"backend/internal/conf"
	"backend/internal/data"
	"backend/internal/server"
	"backend/internal/service"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

// wireApp init kratos application.
func wireApp(*conf.Server, *conf.Data, log.Logger, *mongo.Client, *redis.Client, *conf.Bootstrap) (*kratos.App, func(), error) {
	panic(wire.Build(conf.ProviderSet, server.ProviderSet, data.ProviderSet, biz.ProviderSet, service.ProviderSet, newApp))
}
