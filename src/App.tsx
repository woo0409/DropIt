import { useStackStore } from './store/stackStore'
import { useEffect, useState } from 'react'

function App() {
  const { items, settings, isLoading, load, updateSettings } = useStackStore()
  const [maxDepthInput, setMaxDepthInput] = useState(settings.maxDepth.toString())

  // 在 popup 打开时从 storage 加载数据
  useEffect(() => {
    load()
  }, [load])

  // 同步 settings.maxDepth 变化到本地状态
  useEffect(() => {
    setMaxDepthInput(settings.maxDepth.toString())
  }, [settings.maxDepth])

  const handleMaxDepthBlur = () => {
    const value = parseInt(maxDepthInput, 10)
    if (value >= 1 && value <= 1000) {
      updateSettings({ maxDepth: value })
    } else {
      // 恢复原值
      setMaxDepthInput(settings.maxDepth.toString())
    }
  }

  const handleMaxDepthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMaxDepthBlur()
    }
  }

  const toggleCloseAfterPush = () => {
    updateSettings({ closeAfterPush: !settings.closeAfterPush })
  }

  return (
    <div className="w-80 h-96 bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">DropIt</h1>
        <p className="text-xs text-gray-500">极简稍后阅读</p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center text-gray-500">加载中...</div>
        ) : (
          <div className="space-y-4">
            {/* 栈状态显示 */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-sm text-gray-600">
                栈中项: {items.length}
              </div>
              <div className="text-sm text-gray-600">
                当前深度: {items.length} / {settings.maxDepth}
              </div>
            </div>

            {/* 设置区域 */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">设置</h3>

              {/* 最大深度输入 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">最大深度</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={maxDepthInput}
                  onChange={(e) => setMaxDepthInput(e.target.value)}
                  onBlur={handleMaxDepthBlur}
                  onKeyDown={handleMaxDepthKeyDown}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>

              {/* 关闭标签页开关 */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">保存后关闭标签页</label>
                <button
                  onClick={toggleCloseAfterPush}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.closeAfterPush ? 'bg-slate-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      settings.closeAfterPush ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
