import { taskLog } from "@clack/prompts";

export type TaskWithLogDefinition = {
  title: string;
  task: (logger: ReturnType<typeof taskLog>) => Promise<{ sucess: boolean; message: string }>;
};

export async function tasksWithLogs(tasksDefinitions: TaskWithLogDefinition[]) {
  for (const task of tasksDefinitions) {
    const tmpLog = taskLog({
      title: task.title,
      retainLog: true,
    });
    const result = await task.task(tmpLog);
    if (result.sucess) {
      tmpLog.success(result.message);
    } else {
      tmpLog.error(result.message);
      throw new Error(result.message);
    }
  }
}
