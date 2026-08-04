import api from './api';

export type LibraryType = 'SCHOOL' | 'STANDARD';

export interface LibraryFeatures {
  academicFields: boolean;
  ranking: boolean;
  contents: boolean;
}

export interface LibrarySettings {
  libraryType: LibraryType;
  readerCanEditAvatar: boolean;
  features: LibraryFeatures;
}

export const defaultLibrarySettings: LibrarySettings = {
  libraryType: 'SCHOOL',
  readerCanEditAvatar: true,
  features: {
    academicFields: true,
    ranking: true,
    contents: true,
  },
};

export const getSettings = async (): Promise<LibrarySettings> => {
  const response = await api.get('/api/settings');
  return response.data;
};

export const updateSettings = async (
  libraryType: LibraryType,
  readerCanEditAvatar?: boolean,
): Promise<LibrarySettings> => {
  // `readerCanEditAvatar` é opcional no backend: quando `undefined`, o
  // JSON.stringify do axios remove a chave e a flag atual é preservada.
  const response = await api.put('/api/settings', {
    libraryType,
    readerCanEditAvatar,
  });
  return response.data;
};
