import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { AspectRatio } from '../ui/aspect-ratio';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageOff } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  image_url?: string;
  isNew?: boolean;
  isOnSale?: boolean;
  salePrice?: number;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  image_url,
  isNew,
  isOnSale,
  salePrice,
  onAddToCart,
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Get the display image URL - use image_url if available, otherwise use the image field
  // Both image and image_url should be complete URLs from the backend
  const displayImage = !imageError && (image_url || image);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={name}
              className="object-cover w-full h-full rounded-t-lg"
              onError={(e) => {
                console.error('Image load error for:', name, 'URL:', displayImage);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </AspectRatio>
        <div className="absolute top-2 left-2 flex gap-2">
          {isNew && (
            <Badge>New</Badge>
          )}
          {isOnSale && (
            <Badge variant="destructive">Sale</Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{name}</h3>
        <div className="flex items-center gap-2">
          {isOnSale ? (
            <>
              <span className="text-lg font-bold">₹{salePrice?.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">₹{price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-bold">₹{price.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          onClick={onAddToCart}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard; 