#!/bin/bash

echo "🚀 启动CharacterVerse服务 (无Redis版本)"
echo "========================================"
echo ""
echo "⚠️  注意: 由于Docker网络问题，暂时跳过Redis服务"
echo "📝 后端将使用内存存储替代Redis功能"
echo ""

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down 2>/dev/null

# 使用临时配置启动服务
echo "🔄 启动服务 (MySQL + Backend + Frontend)..."
docker-compose -f docker-compose-temp.yml up -d --build

echo ""
echo "⏳ 等待服务启动..."
sleep 10

echo ""
echo "🔍 检查服务状态..."
docker-compose -f docker-compose-temp.yml ps

echo ""
echo "🌐 服务访问地址:"
echo "   前端: http://localhost:5173"
echo "   后端API: http://localhost:8080"
echo "   MySQL: localhost:3306"
echo ""
echo "✅ 服务启动完成！"
echo ""
echo "💡 提示: Redis功能暂时禁用，聊天历史等功能可能受影响"
echo "   如需完整功能，请解决Docker网络问题后重新启动"