version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:management
    container_name: rabbitmq
    ports:
      - "5672:5672" # Cổng AMQP để các service kết nối
      - "15672:15672" # Cổng giao diện quản trị
    environment:
      RABBITMQ_DEFAULT_USER: admin # Tên người dùng mặc định
      RABBITMQ_DEFAULT_PASS: admin123 # Mật khẩu mặc định
    networks:
      - rabbitmq_network

  redis:
    image: redis:latest
    container_name: redis
    ports:
      - "6379:6379"  # Cổng mặc định của Redis
    command: ["redis-server", "--requirepass", "1234qwer!"]
    networks:
      - rabbitmq_network
networks:
  rabbitmq_network:
    driver: bridge
