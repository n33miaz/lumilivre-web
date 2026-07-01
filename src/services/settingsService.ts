import api from './api';

export type LibraryType = 'SCHOOL' | 'STANDARD';

export interface LibraryFeatures {
  academicFields: boolean;
  ranking: boolean;
  thesis: boolean;
}

export interface LibrarySettings {
  libraryType: LibraryType;
  features: LibraryFeatures;
}

export const defaultLibrarySettings: LibrarySettings = {
  libraryType: 'SCHOOL',
  features: {
    academicFields: true,
    ranking: true,
    thesis: true,
  },
};

export const getSettings = async (): Promise<LibrarySettings> => {
  const response = await api.get('/api/settings');
  return response.data;
};

export const updateSettings = async (
  libraryType: LibraryType,
): Promise<LibrarySettings> => {
  const response = await api.put('/api/settings', { libraryType });
  return response.data;
};
