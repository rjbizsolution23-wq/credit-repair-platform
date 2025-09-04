import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskBoardComponent } from './task-board/task-board.component';

const routes: Routes = [
  {
    path: '',
    component: TaskListComponent,
    data: {
      title: 'Tasks',
      description: 'Manage your tasks'
    }
  },
  {
    path: 'board',
    component: TaskBoardComponent,
    data: {
      title: 'Task Board',
      description: 'Kanban-style task management'
    }
  },
  {
    path: 'new',
    component: TaskFormComponent,
    data: {
      title: 'New Task',
      description: 'Create a new task',
      mode: 'create'
    }
  },
  {
    path: ':id',
    component: TaskDetailComponent,
    data: {
      title: 'Task Details',
      description: 'View task details'
    }
  },
  {
    path: ':id/edit',
    component: TaskFormComponent,
    data: {
      title: 'Edit Task',
      description: 'Edit task',
      mode: 'edit'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }