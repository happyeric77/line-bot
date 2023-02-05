
export class PomodoroManager {
    private pomodoros = new Map<string, (NodeJS.Timer)>()
    get ongoingUnits(): string[] {
        return Array.from(this.pomodoros.keys())
    }
    public addUnit(userId: string, timer: NodeJS.Timer): void {
        this.pomodoros.set(userId, timer)
    }
    public removeUnit(userId: string): boolean {
        const timer = this.pomodoros.get(userId)
        if (timer){
            clearInterval(timer)
            this.pomodoros.delete(userId)
            return true
        }
        return false
    }
}