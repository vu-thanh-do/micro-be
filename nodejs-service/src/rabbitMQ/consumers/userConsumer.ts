import amqp  from 'amqplib';
import { inject, injectable } from "inversify";

@injectable()
class UserConsumer {
    constructor(){

    }
    async  consume(message: string, msg: amqp.ConsumeMessage, channel: amqp.Channel) {
    // Logic xử lý khi nhận message về tạo user mới
    try {
      const data = JSON.parse(message);

      if (data.action === 'getUserInfo') {
        const UserId = data.UserId;
        console.log(UserId,'token')
        
        // let response;
        
        try {
          // const user = await Users.findByPk(decoded.UserId);

          // if (!user) {
          //   response = {
          //     status: 400,
          //     message: "Token không hợp lệ hoặc user không tồn tại!",
          //   };
          // } else {
          //   response = {
          //     status: 200,
          //     data: {
          //       UserId: user.UserId,
          //       Username: user.Username,
          //       Email: user.Email,
          //       RoleId: user.RoleId,
          //       Avatar: user.Avatar,
          //       EmployeeCode: user.EmployeeCode,
          //     },
          //   };
          // }
        } catch (err) {
          // response = { status: 400, message: 'Token lỗi' };
        }

        // Gửi response về lại micro A
        // channel.sendToQueue(
        //   msg.properties.replyTo,
        //   Buffer.from(JSON.stringify(response)),
        //   {
        //     correlationId: msg.properties.correlationId,
        //   }
        // );
      }

      // Acknowledge
      channel.ack(msg);
    } catch (error) {
      console.error("Error in UserConsumer.consume():", error);
      channel.nack(msg, false, false); // từ chối xử lý nếu lỗi
    }
    // Thêm logic xử lý, lưu vào database, v.v...
  }
}

export default UserConsumer;
