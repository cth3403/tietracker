import React, {CSSProperties, FormEvent, RefObject, useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

import {rootConnector, RootProps} from '../../store/thunks/index.thunks';

import {Project, ProjectData} from '../../models/project';
import {ProjectsService} from '../../services/projects/projects.service';

import {
    IonButton,
    IonButtons, IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon, IonInput, IonItem, IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar
} from '@ionic/react';

import {Settings} from '../../models/settings';

import {RootState} from '../../store/reducers';
import {Client} from '../../models/client';

export enum ProjectModalAction {
    CREATE,
    UPDATE
}

interface Props extends RootProps {
    closeAction: Function;
    projectId: string | undefined;
    color: string | undefined;
    colorContrast: string;
    action: ProjectModalAction | undefined;
    client: Client | undefined;
}

const ProjectModal: React.FC<Props> = (props) => {

    const settings: Settings = useSelector((state: RootState) => state.settings.settings);

    const [project, setProject] = useState<Project | undefined>(undefined);

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    const [valid, setValid] = useState<boolean>(true);

    const [name, setName] = useState<string | undefined>(undefined);
    const [rate, setRate] = useState<number | undefined>(undefined);
    const [vat, setVat] = useState<boolean>(false);

    const nameRef: RefObject<any> = useRef();
    const rateRef: RefObject<any> = useRef();

    useEffect(() => {
        setLoading(true);

        loadProject();

        setLoading(false);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.action]);

    async function loadProject() {
        const project: Project | undefined = await ProjectsService.getInstance().find(props.projectId);

        console.log('here', project, props.projectId);

        setProject(project);

        setName(project && project.data !== undefined ? project.data.name : undefined);
        setRate(project && project.data !== undefined && project.data.rate !== undefined ? project.data.rate.hourly : undefined);
        setVat(project && project.data !== undefined && project.data.rate !== undefined ? project.data.rate.vat : false);

        if (!project || project.data === undefined) {
            console.log(nameRef.current);

            nameRef.current.value = undefined;
            rateRef.current.value = undefined;
        }
    }

    function handleClientNameInput($event: CustomEvent<KeyboardEvent>) {
        setName(($event.target as InputTargetEvent).value);
    }

    function handleProjectRateInput($event: CustomEvent<KeyboardEvent>) {
        setRate(parseInt(($event.target as InputTargetEvent).value));
    }

    function onVatChange($event: CustomEvent) {
        setVat($event.detail.checked);
    }

    function validateProject() {
        setValid(name !== undefined && name.length >= 3 && rate !== undefined && rate >= 0);
    }

    async function handleSubmit($event: FormEvent<HTMLFormElement>) {
        $event.preventDefault();

        if (props.action === ProjectModalAction.UPDATE && (!project || !project.data)) {
            return;
        }

        if (props.action === undefined) {
            return;
        }

        setSaving(true);

        try {
            if (props.action === ProjectModalAction.UPDATE) {
                await updateProject();
            } else {
                await createProject();
            }

            props.closeAction(true);
        } catch (err) {
            // TODO show err
            console.error(err);
        }

        setSaving(false);
    }

    async function createProject() {
        if (!name || name === undefined || rate === undefined) {
            return;
        }

        const data: ProjectData =  {
            name: name,
            from: new Date().getTime(),
            rate: {
                hourly: rate,
                vat: vat
            }
        };

        await ProjectsService.getInstance().create(props.client, data);
    }

    async function updateProject() {
        let projectToUpdate: Project = {...project as Project};

        if (!projectToUpdate || projectToUpdate.data === undefined || projectToUpdate.data.rate === undefined) {
            return;
        }

        projectToUpdate.data.name = name as string;
        projectToUpdate.data.rate.hourly = rate as number;
        projectToUpdate.data.rate.vat = vat;

        await ProjectsService.getInstance().update(projectToUpdate);
    }

    return (
        <IonContent>
            <IonHeader>
                <IonToolbar style={{'--background': props.color, '--color': props.colorContrast} as CSSProperties}>
                    <IonTitle>{name !== undefined ? name : ''}</IonTitle>
                    <IonButtons slot="start">
                        <IonButton onClick={() => props.closeAction()}>
                            <IonIcon name="close" slot="icon-only"></IonIcon>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <main className="ion-padding">
                {renderProject()}
            </main>
        </IonContent>
    );

    function renderProject() {
        if (loading) {
            return <div className="spinner"><IonSpinner color="primary"></IonSpinner></div>
        }

        return <form onSubmit={($event: FormEvent<HTMLFormElement>) => handleSubmit($event)}>
            <IonList className="inputs-list">
                <IonItem className="item-title">
                    <IonLabel>Project</IonLabel>
                </IonItem>
                <IonItem>
                    <IonInput debounce={500} minlength={3} maxlength={32} ref={nameRef}
                              required={true} input-mode="text" value={name}
                              onIonInput={($event: CustomEvent<KeyboardEvent>) => handleClientNameInput($event)}
                              onIonChange={() => validateProject()}>
                    </IonInput>
                </IonItem>

                <IonItem className="item-title">
                    <IonLabel>Hourly rate</IonLabel>
                </IonItem>
                <IonItem>
                    <IonInput debounce={500} minlength={1} required={true} ref={rateRef}
                              input-mode="text" value={`${rate ? rate : ''}`}
                              onIonInput={($event: CustomEvent<KeyboardEvent>) => handleProjectRateInput($event)}
                              onIonChange={() => validateProject()}>
                    </IonInput>
                </IonItem>

                {renderVat()}
            </IonList>

            <IonButton type="submit" disabled={saving || !valid} aria-label="Update project"
                       className="ion-margin-top" style={{
                '--background': props.color,
                '--color': props.colorContrast,
                '--background-hover': props.color,
                '--color-hover': props.colorContrast,
                '--background-activated': props.colorContrast,
                '--color-activated': props.color
            } as CSSProperties}>
                <IonLabel>{props.action === ProjectModalAction.CREATE ? 'Create' : 'Update'}</IonLabel>
            </IonButton>
        </form>
    }

    function renderVat() {
        if (!settings.vat || settings.vat === undefined) {
            return undefined;
        }

        return <>
            <IonItem className="item-title">
                <IonLabel>Vat</IonLabel>
            </IonItem>
            <IonItem className="item-checkbox">
                <IonLabel>{settings.vat}%</IonLabel>
                <IonCheckbox slot="end"
                             checked={vat}
                             onIonChange={($event: CustomEvent) => onVatChange($event)}></IonCheckbox>
            </IonItem>
        </>
    }
};

export default rootConnector(ProjectModal);
