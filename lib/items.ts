import fs from 'fs';
import path from 'path';

export interface FreeItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  condition: string;
  pickup: string;
  contact: string;
  status: 'available' | 'pending' | 'claimed';
  category: string;
  added: string;
  owner?: string | null;
  pickupLat?: number | null;
  pickupLon?: number | null;
}

interface ItemsFile {
  items: FreeItem[];
}

export function getItems(): FreeItem[] {
  const filePath = path.join(process.cwd(), 'items.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data: ItemsFile = JSON.parse(raw);
    return (data.items || [])
      .filter((i) => i.name && i.status !== 'claimed')
      .map((i) => ({
        ...i,
        category: i.category || 'Other',
        images: (i.images || []).filter(
          (src) => src.startsWith('/items/') || src.startsWith('https://')
        ),
      }));
  } catch {
    return [];
  }
}
