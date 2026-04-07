// get-media-from-task.pipe.spec.ts
import { getMediaFromTask } from './getMediaFromTask.pipe';

describe('getMediaFromTask Pipe', () => {
  let pipe: getMediaFromTask;

  const mockTask = {
    activeMedia: [
      {
        state: 'connected',
        type: { direction: 'inbound' },
        queue: { name: 'MainQueue' },
      },
      {
        state: 'queued',
        type: { direction: 'outbound' },
        queue: { name: 'SupportQueue' },
      },
    ],
  };

  beforeEach(() => {
    pipe = new getMediaFromTask();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return direction when n = "direction"', () => {
    const result = pipe.transform(mockTask, 'direction');
    expect(result).toBe('outbound'); // from queued media
  });

  it('should return queue name when n = "queueName"', () => {
    const result = pipe.transform(mockTask, 'queueName');
    expect(result).toBe('SupportQueue'); // from queued media
  });

  it('should return undefined if no queued media exists', () => {
    const taskWithoutQueued = {
      activeMedia: [
        {
          state: 'connected',
          type: { direction: 'inbound' },
          queue: { name: 'MainQueue' },
        },
      ],
    };
    const result = pipe.transform(taskWithoutQueued, 'direction');
    expect(result).toBeUndefined();
  });

  it('should return undefined for unknown n value', () => {
    const result = pipe.transform(mockTask, 'unknown');
    expect(result).toBeUndefined();
  });
});
