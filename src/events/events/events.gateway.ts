// events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3001' },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // เชฟ/แคชเชียร์ join room ของร้านตัวเอง
  @SubscribeMessage('join_restaurant')
  handleJoin(@MessageBody() restaurant_id: string) {
    return { event: 'joined', data: restaurant_id };
  }

  // เรียกจาก OrderService ตอนมี order ใหม่
  notifyNewOrder(restaurant_id: string, order: any) {
    this.server.emit(`restaurant_${restaurant_id}`, {
      event: 'new_order',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      order,
    });
  }

  // เรียกตอน status เปลี่ยน
  notifyOrderStatus(restaurant_id: string, order: any) {
    this.server.emit(`restaurant_${restaurant_id}`, {
      event: 'order_status_changed',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      order,
    });
  }
}
