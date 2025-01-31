import React from 'react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Welcome to Venkata Srinivasa Agencies</h1>
      <div className="prose lg:prose-xl">
        <p>
          Welcome to our specialized pesticide shop, where we provide high-quality
          pest control solutions for agricultural and domestic use.
        </p>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quality assured products from trusted manufacturers</li>
            <li>Expert guidance on product selection and usage</li>
            <li>Competitive pricing and bulk purchase options</li>
            <li>Fast and secure shipping</li>
            <li>Environmental responsibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 