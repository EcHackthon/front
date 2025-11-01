import React from 'react';
import TrackList from '../components/TrackList';
import './styles/Playlist.css';

export default function Playlist() {
  // For the Playlist page we want to render nothing when there are no recommendations.
  return (
    <div className="playlist-page">
  <TrackList emptyVariant="none" variant="playlist" />
    </div>
  );
}
