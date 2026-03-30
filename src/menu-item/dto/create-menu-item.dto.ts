export class CreateMenuItemDto {
    restaurant_id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
}