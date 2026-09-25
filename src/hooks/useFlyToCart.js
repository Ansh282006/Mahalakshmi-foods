import { useCallback } from 'react';

export default function useFlyToCart() {
  const flyToCart = useCallback((sourceElement) => {
    const cartIcon = document.querySelector('.cart-link');
    if (!cartIcon || !sourceElement) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const img = sourceElement.querySelector('img') || sourceElement;
    const clone = img.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.borderRadius = '50%';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.objectFit = 'cover';
    clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    clone.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
    document.body.appendChild(clone);

    void clone.offsetWidth;

    const deltaX = cartRect.left + cartRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const deltaY = cartRect.top + cartRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.15)`;
      clone.style.opacity = '0.3';
    });

    setTimeout(() => {
      clone.remove();
      cartIcon.classList.add('cart-bounce');
      setTimeout(() => cartIcon.classList.remove('cart-bounce'), 600);
    }, 850);
  }, []);

  return flyToCart;
}