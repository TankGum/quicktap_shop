import { Config } from '@remotion/cli/config';

// Ảnh sản phẩm lấy thẳng từ public/ của website — không chép sang đây, để video luôn dùng
// đúng bộ ảnh đang hiện trên site (staticFile('assets/...') trỏ vào ../public/assets/...).
Config.setPublicDir('../public');

Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
