import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Order } from '../types/order';

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Shipping Address: {order.shipping_address}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Amount: ${order.total_amount}
          </div>
          {order.created_by_role !== 'CUSTOMER' && (
            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">Location Information</h3>
              {order.location_city && (
                <div className="text-sm text-muted-foreground">
                  City: {order.location_city}
                </div>
              )}
              {order.location_state && (
                <div className="text-sm text-muted-foreground">
                  State: {order.location_state}
                </div>
              )}
              {order.location_country && (
                <div className="text-sm text-muted-foreground">
                  Country: {order.location_country}
                </div>
              )}
              {order.location_latitude && order.location_longitude && (
                <div className="text-sm text-muted-foreground">
                  Coordinates: {order.location_latitude}, {order.location_longitude}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDetails; 
