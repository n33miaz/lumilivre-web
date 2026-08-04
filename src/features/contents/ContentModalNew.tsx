import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ContentForm } from './ContentForm';
import { useCreateContent } from '../../hooks/mutations/useContentMutations';
import { type ContentPayload } from '../../services/contentService';

interface ContentModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ContentModalNew({ onClose, onSuccess }: ContentModalNewProps) {
  const { t } = useTranslation('contents');
  const { mutateAsync: createContent, isPending } = useCreateContent();

  const handleSubmit = async (
    payload: ContentPayload,
    coverFile: File | null,
    docFile: File | null,
  ) => {
    try {
      await createContent({ payload, coverFile, docFile });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Modal.Body>
        <ContentForm formId="form-novo-conteudo" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-conteudo"
          isLoading={isPending}
          className="w-full"
        >
          {t('button.new')}
        </Button>
      </Modal.Footer>
    </>
  );
}
