import React from 'react';
import { PhotoUpload, PhotoUploadProps } from './PhotoUpload';

export const PhotoUploadWithRewardedAd: React.FC<PhotoUploadProps> = (props) => {
  return <PhotoUpload {...props} />;
};

export default PhotoUploadWithRewardedAd;
