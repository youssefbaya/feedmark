import { useState } from 'react';
import './AssignmentForm.css';
import { useNavigate } from 'react-router-dom';
import { useAssignments } from '../context/AssignmentContext';
import toast from 'react-hot-toast';

function AssignmentForm({
  editMode = false,
  existingAssignment = null
}) {
  const [assignmentName, setAssignmentName] = useState(
    existingAssignment?.name || ''
  );

  const [description, setDescription] = useState(
    existingAssignment?.description || ''
  );

  const [totalMarks, setTotalMarks] = useState(
    existingAssignment?.totalMarks || ''
  );

  const [sections, setSections] = useState(
    existingAssignment?.sections || []
  );

  const {
    addAssignment,
    updateAssignment
  } = useAssignments();

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    const newSection = {
      id: Date.now(),
      name: '',
      criteria: []
    };

    setSections([...sections, newSection]);
  };

  const updateSectionName = (sectionId, name) => {
    setSections(
      sections.map(section =>
        section.id === sectionId
          ? { ...section, name }
          : section
      )
    );
  };

  const addCriterion = (sectionId) => {
    const newCriterion = {
      id: Date.now(),
      name: '',
      maxMarks: ''
    };

    setSections(
      sections.map(section =>
        section.id === sectionId
          ? {
            ...section,
            criteria: [...section.criteria, newCriterion]
          }
          : section
      )
    );
  };

  const updateCriterion = (
    sectionId,
    criterionId,
    field,
    value
  ) => {
    setSections(
      sections.map(section =>
        section.id === sectionId
          ? {
            ...section,
            criteria: section.criteria.map(criterion =>
              criterion.id === criterionId
                ? { ...criterion, [field]: value }
                : criterion
            )
          }
          : section
      )
    );
  };

  const removeSection = (sectionId) => {
    setSections(
      sections.filter(section => section.id !== sectionId)
    );
  };

  const removeCriterion = (sectionId, criterionId) => {
    setSections(
      sections.map(section =>
        section.id === sectionId
          ? {
            ...section,
            criteria: section.criteria.filter(
              c => c.id !== criterionId
            )
          }
          : section
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const normalisedSections = sections.map(section => ({
      ...section,
      criteria: section.criteria.map(criterion => ({
        ...criterion,
        maxMarks: criterion.maxMarks || criterion.max_marks || ''
      }))
    }));

    const assignment = {
      name: assignmentName,
      description,
      totalMarks,
      sections: normalisedSections
    };

    if (editMode && existingAssignment) {
      await updateAssignment(
        existingAssignment.id,
        assignment
      );

      toast.success(
        'Assignment updated successfully'
      );

    } else {
      await addAssignment({
        ...assignment,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });

      toast.success(
        'Assignment created successfully'
      );
    }

    setSaving(false);
    navigate('/assignments');
  };

  return (
    <form
      className="assignment-form"
      onSubmit={handleSubmit}
    >
      <div className="form-section">
        <h2>Assignment Details</h2>

        <div className="form-group">
          <label>Assignment Name *</label>

          <input
            type="text"
            value={assignmentName}
            onChange={(e) =>
              setAssignmentName(e.target.value)
            }
            placeholder="e.g., Web Development Coursework"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Brief description of the assignment"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Total Marks *</label>

          <input
            type="number"
            value={totalMarks}
            onChange={(e) =>
              setTotalMarks(e.target.value)
            }
            placeholder="100"
            required
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h2>Marking Scheme</h2>

          <button
            type="button"
            onClick={addSection}
            className="btn-add"
          >
            + Add Section
          </button>
        </div>

        {sections.length === 0 && (
          <p className="empty-message">
            No sections yet. Add a section to get started.
          </p>
        )}

        {sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="section-card"
          >
            <div className="section-header-row">
              <input
                type="text"
                value={section.name}
                onChange={(e) =>
                  updateSectionName(
                    section.id,
                    e.target.value
                  )
                }
                placeholder={`Section ${sectionIndex + 1} name`}
                className="section-name-input"
              />

              <button
                type="button"
                onClick={() =>
                  removeSection(section.id)
                }
                className="btn-remove"
              >
                Remove Section
              </button>
            </div>

            <div className="criteria-list">
              {section.criteria.map(
                (criterion, criterionIndex) => (
                  <div
                    key={criterion.id}
                    className="criterion-row"
                  >
                    <span className="criterion-number">
                      {criterionIndex + 1}.
                    </span>

                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) =>
                        updateCriterion(
                          section.id,
                          criterion.id,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Criterion description"
                      className="criterion-input"
                    />

                    <input
                      type="number"
                      value={
                        criterion.maxMarks ||
                        criterion.max_marks ||
                        ''
                      }
                      onChange={(e) =>
                        updateCriterion(
                          section.id,
                          criterion.id,
                          'maxMarks',
                          e.target.value
                        )
                      }
                      placeholder="Marks"
                      className="marks-input"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeCriterion(
                          section.id,
                          criterion.id
                        )
                      }
                      className="btn-remove-small"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                addCriterion(section.id)
              }
              className="btn-add-criterion"
            >
              + Add Criterion
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
        >
          {saving
            ? (editMode ? 'Updating...' : 'Creating...')
            : (editMode ? 'Update Assignment' : 'Create Assignment')}
        </button>
      </div>
    </form>
  );
}

export default AssignmentForm;