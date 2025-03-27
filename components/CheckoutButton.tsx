import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutButton: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();

    const handleClick = async () => {
        if (!stripe || !elements) {
            return;
        }

        // Use the sessionId you get from your backend (or pre-created session)
        const sessionId = 'YOUR_SESSION_ID_HERE'; // Replace with your session ID

        // Redirect to Stripe Checkout page using the sessionId
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            console.error('Stripe Checkout Error:', error);
        }
    };

    return (
        <button role="link" onClick={handleClick} disabled={!stripe}>
            Checkout with Stripe
        </button>
    );
};

export default CheckoutButton;
