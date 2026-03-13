'use client';

import Script from 'next/script';

// Declare stripe-buy-button as a valid JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': {
        'buy-button-id': string;
        'publishable-key': string;
      };
    }
  }
}

const PUBLISHABLE_KEY = 'pk_live_51N5LUvFFnwNrhEtR2twgCj005rwFgXuZOjRZkBiCVU1GflHJxzUYeQaYA4dGZJ72Mp1KzKuQncNY1YHhHLXijMou00L61Ixphw';

export function StripeBuyButton({ buyButtonId }: { buyButtonId: string }) {
  return (
    <>
      <Script src="https://js.stripe.com/v3/buy-button.js" strategy="lazyOnload" />
      <stripe-buy-button
        buy-button-id={buyButtonId}
        publishable-key={PUBLISHABLE_KEY}
      />
    </>
  );
}
