import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  originalName: string;

  @Column()
  url: string;

  @Column()
  format: string;

  @Column()
  size: number;

  @Column('float')
  duration: number;

  @CreateDateColumn()
  createdAt: Date;
}
