'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/siteConfig';
import { PhoneIcon } from './icons';

export default function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Chừa khoảng trống cuối trang trên mobile để nội dung (đặc biệt là
    // footer) không bị thanh CTA cố định che mất.
    document.body.classList.add('has-mobile-cta');
    return () => document.body.classList.remove('has-mobile-cta');
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pastTop = window.scrollY > 480;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 220;
      setVisible(pastTop && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className={`mobile-cta${visible ? ' is-visible' : ''}`}>
      <a className="btn btn-primary" href={siteConfig.phoneHref}>
        <PhoneIcon className="i" />
        Gọi đặt hàng · {siteConfig.phoneDisplay}
      </a>
    </div>
  );
}
