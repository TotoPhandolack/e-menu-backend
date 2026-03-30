export class CreateOrderItemDto {
    menu_item_id: string;
    quantity: number;
    special_note?: string;
}

export class CreateOrderDto {
    table_id: string;
    session_id: string;
    items: CreateOrderItemDto[];
}