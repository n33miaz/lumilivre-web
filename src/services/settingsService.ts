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
  /**
   * Flag **honrada pelo cliente**: esconde o modo convidado no app. Não é
   * controle de servidor — o catálogo público continua público porque é a
   * vitrine do site.
   */
  guestAccessEnabled: boolean;
  features: LibraryFeatures;
}

export const defaultLibrarySettings: LibrarySettings = {
  libraryType: 'SCHOOL',
  readerCanEditAvatar: true,
  guestAccessEnabled: true,
  features: {
    academicFields: true,
    ranking: true,
    contents: true,
  },
};

export const getSettings = async (): Promise<LibrarySettings> => {
  const response = await api.get('/api/settings');
  return {
    ...defaultLibrarySettings,
    ...response.data,
  };
};

/** Campos opcionais do `PUT /api/settings` (o `libraryType` é obrigatório). */
export interface LibrarySettingsUpdate {
  readerCanEditAvatar?: boolean;
  guestAccessEnabled?: boolean;
}

export const updateSettings = async (
  libraryType: LibraryType,
  changes: LibrarySettingsUpdate = {},
): Promise<LibrarySettings> => {
  // As flags são opcionais no backend: quando `undefined`, o JSON.stringify do
  // axios remove a chave e o valor atual é preservado. Por isso cada toggle
  // manda só o seu campo, em vez de reenviar o estado inteiro da tela.
  const response = await api.put('/api/settings', {
    libraryType,
    readerCanEditAvatar: changes.readerCanEditAvatar,
    guestAccessEnabled: changes.guestAccessEnabled,
  });
  return {
    ...defaultLibrarySettings,
    ...response.data,
  };
};
