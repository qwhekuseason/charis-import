import React from 'react';

export const MtnMomoIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="MTN Mobile Money"
  >
    <rect width="48" height="30" rx="5" fill="#FFCC00" />
    <ellipse cx="24" cy="15" rx="19" ry="11" fill="#002B49" />
    <text
      x="24"
      y="18.5"
      fill="#FFCC00"
      fontSize="9.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor="middle"
      letterSpacing="-0.3px"
    >
      MoMo
    </text>
  </svg>
);

export const TelecelCashIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="Telecel Cash"
  >
    <rect width="48" height="30" rx="5" fill="#FFFFFF" />
    <rect x="0.5" y="0.5" width="47" height="29" rx="4.5" stroke="#E2E8F0" />
    <circle cx="14" cy="15" r="7.5" fill="#E60000" />
    <path
      d="M13.2 11.5v2.5h-1.5v1.8h1.5v3.2c0 .8.4 1.3 1.2 1.3h1.2v-1.6h-.8c-.3 0-.4-.1-.4-.4v-2.5h1.5v-1.8h-1.5v-2.5h-1.2z"
      fill="#FFFFFF"
    />
    <circle cx="17.2" cy="18.8" r="0.9" fill="#FFFFFF" />
    <text
      x="29"
      y="18.5"
      fill="#E60000"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor="middle"
      letterSpacing="-0.3px"
    >
      cash
    </text>
  </svg>
);

export const AtMoneyIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="AT Money (AirtelTigo)"
  >
    <rect width="48" height="30" rx="5" fill="#005BAC" />
    <circle cx="15" cy="15" r="7" fill="#EE2724" />
    <text
      x="15"
      y="18.5"
      fill="#FFFFFF"
      fontSize="9.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor="middle"
    >
      at
    </text>
    <text
      x="32"
      y="18"
      fill="#FFFFFF"
      fontSize="7.5"
      fontWeight="800"
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor="middle"
      letterSpacing="-0.2px"
    >
      money
    </text>
  </svg>
);

export const VisaIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="Visa"
  >
    <rect width="48" height="30" rx="5" fill="#FFFFFF" />
    <rect x="0.5" y="0.5" width="47" height="29" rx="4.5" stroke="#E2E8F0" />
    <path
      d="M18.8 19.5h-2.4l1.5-9.2h2.4l-1.5 9.2zm9.8-9c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 3 0 1.3 1.2 2 2 2.5.8.4 1.1.7 1.1 1.1 0 .6-.7.8-1.4.8-.9 0-1.4-.1-2.2-.5l-.3-.1-.3 1.9c.6.3 1.6.5 2.6.5 2.5 0 4.1-1.2 4.1-3.1 0-1-.6-1.8-2-2.5-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.7 1.4-.7.8 0 1.4.2 1.8.4l.2.1.6-1.9zm6.1 5.8l1-2.8-.6 2.8h-.4zm2.5 3.2h-2.1c-.7 0-1.1-.2-1.4-.8l-3.8-8.4h2.6l1.5 4c.4.9.7 1.9.9 2.3.3-.5.6-1.4 1-2.3l1.3-4h2.4l-2.4 9.2zm-17.2-9.2l-2.3 6.3-.3-1.3c-.5-1.6-1.9-3.4-3.6-4.2l2.2 8.4h2.6l3.9-9.2h-2.5z"
      fill="#1434CB"
    />
  </svg>
);

export const MastercardIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="Mastercard"
  >
    <rect width="48" height="30" rx="5" fill="#FFFFFF" />
    <rect x="0.5" y="0.5" width="47" height="29" rx="4.5" stroke="#E2E8F0" />
    <circle cx="20" cy="15" r="7.5" fill="#EB001B" />
    <circle cx="28" cy="15" r="7.5" fill="#F79E1B" fillOpacity="0.95" />
    <path
      d="M24 9.6a7.48 7.48 0 0 1 3.5 5.4 7.48 7.48 0 0 1-3.5 5.4 7.48 7.48 0 0 1-3.5-5.4A7.48 7.48 0 0 1 24 9.6z"
      fill="#FF5F00"
    />
  </svg>
);

export const CashOnDeliveryIcon = ({ width = 44, height = 28, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 48 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: '5px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', ...style }}
    title="Cash on Delivery / Pickup"
  >
    <rect width="48" height="30" rx="5" fill="#0F172A" />
    <rect x="0.5" y="0.5" width="47" height="29" rx="4.5" stroke="#334155" />
    {/* Banknote */}
    <rect x="6.5" y="8" width="18" height="13" rx="2" stroke="#10B981" strokeWidth="1.3" fill="#064E3B" />
    <circle cx="15.5" cy="14.5" r="2.5" fill="#10B981" />
    <text
      x="35"
      y="18"
      fill="#F8FAFC"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor="middle"
      letterSpacing="0.3px"
    >
      COD
    </text>
  </svg>
);
