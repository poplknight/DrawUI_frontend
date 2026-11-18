# Sourced by start.sh, stop.sh, and restart.sh. Do not execute directly.

DIR=$(pwd)
RUN_DIR="$DIR/.run"
PID_FILE="$RUN_DIR/pid"
LOG_FILE="$RUN_DIR/log"

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$PID_FILE")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

kill_tree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

stop_service() {
  if ! is_running; then
    rm -f "$PID_FILE"
    echo "前端没有在运行"
    return 0
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  kill_tree "$pid"
  local _
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill_tree "$pid"
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
  echo "前端已停止"
}

start_service() {
  if [[ ! -d "$DIR/node_modules" ]]; then
    echo "前端依赖还没安装。先在这个目录执行 pnpm install"
    return 1
  fi
  if is_running; then
    echo "前端已在运行 (pid $(cat "$PID_FILE"))"
    echo "日志: $LOG_FILE"
    return 0
  fi
  mkdir -p "$RUN_DIR"
  (
    cd "$DIR"
    exec pnpm dev -- --host 127.0.0.1 --port 5173 --strictPort
  ) >>"$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" >"$PID_FILE"
  disown "$pid" 2>/dev/null || true
  echo "前端已启动 (pid $pid)"
  echo "日志: $LOG_FILE"
  echo "地址: http://127.0.0.1:5173"
}
