// SSE 服务端推送
async function createFetchSSE(url, method='GET', option={}) {
    const {
        headers = {},
        body,
        onMessage,
        onError,
        onOpen,
        onClose,
        signal // AbortController信号
    } = options

    try{
        const res = await fetch(url, {
            method,
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                ...headers
            },
            signal
        })
        if(!res.ok){
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        onOpen?.()
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            buffer += decoder.decode(value,{ stream: true })

            // 处理SSE消息
            const lines = buffer.split('\n')
            buffer = lines.pop()
            const eventData = {}

            for(const line of lines){
                if(line.startsWith('data:')){
                    const data =  line.slice(6);
                    try{
                        eventData.data = JSON.parse(data)
                    }catch{
                        eventData.data = data
                    }
                    onMessage?.(eventData)
                } else if (line.startsWith('event:')) {
                    eventData.type = line.slice(7)
                } else if (line.startsWith('id:')) {
                    eventData.id = line.slice(4)
                }
                onMessage?.(eventData)
            }
        }
    }
    catch(error){
        onError?.(error)
    }
}