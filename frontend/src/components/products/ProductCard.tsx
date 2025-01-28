import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { AspectRatio } from '../ui/aspect-ratio';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
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
  isNew,
  isOnSale,
  salePrice,
  onAddToCart,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <AspectRatio ratio={4/3}>
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full"
          />
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
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <div className="flex items-center gap-2">
          {isOnSale ? (
            <>
              <span className="text-lg font-bold">${salePrice?.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-bold">${price.toFixed(2)}</span>
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