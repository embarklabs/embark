import { Observable, Subscription, Observer } from 'rxjs';

export const exhaustMapWithLastIgnored = (mapFn: (someValue: any) => Observable<any>) => (source: Observable<any>) => {
  let lastVal: any;
  let outerSubCompleted = false;
  let innerSubActive = false;

  const subscription = new Subscription();

  const innerSubscription = (innerObs: Observable<any>, observer: Observer<any>) => {
    innerSubActive = true;
    lastVal = undefined;
    subscription.add(innerObs.subscribe({
      next: (innerNext) => observer.next(innerNext),
      error: (err) => observer.error(err),
      complete: () => {
        innerSubActive = false;
        if (outerSubCompleted) {
          observer.complete();
        } else if (lastVal) {
          innerSubscription(mapFn(lastVal), observer);
        }
      }
    }));
  };

  return new Observable(observer => {
    subscription.add(source.subscribe({
      next: (n) => {
        if (!innerSubActive) {
          innerSubscription(mapFn(n), observer);
        } else {
          lastVal = n;
        }
      },
      error: (err) => observer.error(err),
      complete: () => {
        if(!innerSubActive) {
          observer.complete();
        }
      }
    }));
    return subscription;
  });
}
