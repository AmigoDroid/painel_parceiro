import React from 'react';
import { createRoot } from 'react-dom/client';
import PublicUploadPlaylist from './PublicUploadPlaylist.jsx';
import './public-upload.css';

// The bootstrap stripped the QR secret before loading any module or private panel code.
const request = window.__PUBLIC_APP_QR__ || { app: '', mac: '', token: '' };
window.__PUBLIC_APP_QR__ = undefined;
createRoot(document.getElementById('root')).render(<PublicUploadPlaylist request={request} />);
