import { Composition } from 'remotion';
import { Promo, PROMO_DURATION } from './Promo';

const common = { component: Promo, durationInFrames: PROMO_DURATION, fps: 30 };

export const Root = () => (
  <>
    <Composition id="Desktop" width={1920} height={1080} {...common} />
    <Composition id="Mobile" width={1080} height={1920} {...common} />
  </>
);
