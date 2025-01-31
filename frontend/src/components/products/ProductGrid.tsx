import React from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  isNew?: boolean;
  isOnSale?: boolean;
  salePrice?: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onAddToCart={() => onAddToCart(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid; 