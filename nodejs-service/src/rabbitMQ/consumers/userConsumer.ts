import { inject, injectable } from "inversify";

@injectable()
class UserConsumer {
    constructor(){

    }
  consume(message: string) {
    // Logic xử lý khi nhận message về tạo user mới
    try {
    const data = JSON.parse(message);
   
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
    // Thêm logic xử lý, lưu vào database, v.v...
  }
}

export default UserConsumer;
