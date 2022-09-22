import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class TestNumberMap extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        unique: false
    })
    phoneNumber!: string;

    @Column({
    })
    home!: string;
}