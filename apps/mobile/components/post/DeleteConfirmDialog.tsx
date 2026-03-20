import { Alert } from 'react-native';

export function showDeleteConfirmDialog(onConfirm: () => void) {
  Alert.alert(
    '삭제 확인',
    '정말 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.',
    [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]
  );
}
