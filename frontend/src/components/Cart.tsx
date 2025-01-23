import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/api';
import UserSelect from './UserSelect';

export default function Cart() {
  const { user } = useAuth();
  const { items, total, loading, error, selectedUserId, setSelectedUserId, updateQuantity, removeItem, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentDeadline, setPaymentDeadline] = useState(7); // Default 7 days
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress) {
      setOrderError('Please provide a shipping address');
      return;
    }

    try {
      setIsSubmitting(true);
      setOrderError('');

      // Create order with selected user if manager/employee
      await createOrder({
        shipping_address: shippingAddress,
        payment_deadline: paymentDeadline,
        items: items.map(item => ({
          product: item.product.id,
          quantity: item.quantity
        })),
        ...(selectedUserId && { user_id: selectedUserId })
      });

      await clearCart();
      setShippingAddress('');
      setPaymentDeadline(7);
      setOrderSuccess(true);
    } catch (err) {
      console.error('Error creating order:', err);
      setOrderError('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading cart...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (orderSuccess) {
    return (
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Order Placed Successfully!</h2>
        <p className="text-gray-600">Thank you for your order.</p>
        <button
          onClick={() => setOrderSuccess(false)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {/* User selection for managers and employees - always show this */}
      {user && ['MANAGER', 'EMPLOYEE'].includes(user.role) && (
        <div className="mb-6">
          <UserSelect
            selectedUserId={selectedUserId}
            onUserSelect={(userId) => {
              setSelectedUserId(userId);
              // Reset shipping address when changing users
              setShippingAddress('');
            }}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">Cart is empty</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 border-b last:border-0"
            >
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-gray-600">${Number(item.product.price).toFixed(2)} each</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right">${Number(item.total).toFixed(2)}</span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${Number(total).toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Address
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Deadline (days)
              </label>
              <input
                type="text"
                value={paymentDeadline}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setPaymentDeadline(1);
                  } else {
                    const numValue = parseInt(value);
                    if (numValue >= 1 && numValue <= 30) {
                      setPaymentDeadline(numValue);
                    } else if (numValue > 30) {
                      setPaymentDeadline(30);
                    }
                  }
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="Enter days (1-30)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the number of days allowed for payment (1-30 days)
              </p>
            </div>

            {orderError && (
              <div className="text-red-500 mb-4">{orderError}</div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={clearCart}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Clear Cart
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : 'Checkout'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 