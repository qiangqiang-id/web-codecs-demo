enum StatusEnum {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAIL = 'fail',
}

export const StatusLabel = {
  [StatusEnum.PENDING]: '处理中...',
  [StatusEnum.SUCCESS]: '处理成功',
  [StatusEnum.FAIL]: '处理失败',
}

export default StatusEnum
