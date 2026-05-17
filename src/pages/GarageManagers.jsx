import { memo, useCallback, useState } from 'react';
import { KeyRound } from 'lucide-react';
import GenericCrudPage from '../components/features/GenericCrudPage';
import ChangePasswordModal from '../components/features/ChangePasswordModal';
import { garageManagersConfig } from '../config/entityConfigs.jsx';
import { garageManagersAPI } from '../services/api';

function GarageManagers() {
  const [passwordTarget, setPasswordTarget] = useState(null);

  const handleOpenChangePassword = useCallback((manager) => {
    setPasswordTarget(manager);
  }, []);

  const handleCloseChangePassword = useCallback(() => {
    setPasswordTarget(null);
  }, []);

  const customActions = useCallback(
    (item) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenChangePassword(item);
        }}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-[#eecd7e]"
        title="Đổi mật khẩu"
      >
        <KeyRound size={16} />
      </button>
    ),
    [handleOpenChangePassword]
  );

  return (
    <>
      <GenericCrudPage
        api={garageManagersAPI}
        columns={garageManagersConfig.columns}
        fieldsForModal={garageManagersConfig.fieldsForModal}
        title={garageManagersConfig.title}
        showPagination={true}
        limit={20}
        showSearch={true}
        searchPlaceholder="Tìm theo gara / tên / SĐT / email..."
        customActions={customActions}
      />

      <ChangePasswordModal
        isOpen={Boolean(passwordTarget)}
        onClose={handleCloseChangePassword}
        manager={passwordTarget}
        api={garageManagersAPI}
        requireCurrentPassword={false}
      />
    </>
  );
}

export default memo(GarageManagers);
