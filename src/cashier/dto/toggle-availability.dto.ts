import { IsBoolean } from 'class-validator';

export class ToggleAvailabilityDto {
  @IsBoolean()
  is_available: boolean;
}
